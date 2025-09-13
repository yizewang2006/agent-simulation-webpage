package filters;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Predicate;

import Action.Action;
import Action.NeighborReference;
import Action.SpaceReference_Expand;
import Activation.Activation;
import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import Utility.GlobalVariable;
import Utility.ReturnSenseObstacle;
import Utility.myUtility;
import agents.Agent;
import agents.FieldOfView;
import agents.Position;
import agents.Property;
import agents.Property_numeric;
import behavior.BehaviorTemplate;
import core.Main;
import entities.Entity;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;
import searchMethod.filterTemplate_dataStructure;
public class Filter_ranged extends Filter
{
	
	public myUtility myUtility = new myUtility();
	
	public double lowerRange = 0;
	
	public double upperRange = 0;
		
	public ArrayList<Double> filtered_set = new ArrayList<Double>();
	
	public Filter_ranged(int type)
	{
		super(type,0);
		this.lowerRange = 0;
		this.upperRange = 0;
	}
	
	//For random filter
	public Filter_ranged(double filtered_p, Action act, int type)
	{
		
		super(type,filtered_p);
		
		Random rand;
		
		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		}

		//This agent sorely proposed is to get a reference values
		Agent a = new Agent();

		if (act instanceof NeighborReference)
		{
			Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
			

			//Numerical property with lower range and upper range
			if (Main.searchSpace.numerical_property.contains(filtered_p))
			{
				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;
			}
			//Category property with range is a set
			else
			{
				for (Double d : chosen_filter_range.filtered_set)
				{
					this.filtered_set.add(d);
				}
			}
		}
		else if (act instanceof SpaceReference_Expand)
		{
			//Space behavior for now only deal with numeric property
			Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template_forSpace_behavior);
		
			this.lowerRange = chosen_filter_range.lowerRange;

			this.upperRange = chosen_filter_range.upperRange;
		}
		
	}

	//For random filter with option
	public Filter_ranged(double filtered_p, double option, int type)
	{

		super(type,filtered_p);

		Random rand;
		
		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		}

		if (filtered_p == 2.1)
		{
			//Sense left
			if (option == -1)
			{
				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				
				while(!(chosen_filter_range.lowerRange < 0 && chosen_filter_range.upperRange < 0) )
				{
					chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				}
				
				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;
			}
			//Sense both
			else if (option == 0)
			{
				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				
				while(!(chosen_filter_range.lowerRange < 0 && chosen_filter_range.upperRange > 0) )
				{
					chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				}
				
				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;
			}
			//sense right
			else if (option == 1)
			{
				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				
				while(!(chosen_filter_range.lowerRange >= 0 && chosen_filter_range.upperRange > 0) )
				{
					chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				}
				
				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;
			}
		}
		else if (filtered_p == 4.0 || filtered_p == 4.1)
		{
			this.filtered_set.add(option);
		}

		if (filtered_p == 2.1 && this.lowerRange == 0 && this.upperRange == 0)
		{
			System.out.println("Check filter_range.java");
		}
	}
		
	//For hard code
	//For range numeric option
	public Filter_ranged(double filtered_property, double lowerD, double upperD, int type)
	{
		super(type,filtered_property);
		
		this.filtered_p = filtered_property;
		
		this.lowerRange = lowerD;
		
		this.upperRange = upperD;
	}
	
	//For range set option
	public Filter_ranged(double filtered_property, ArrayList<Double> set, int type)
	{
		super(type,filtered_property);
		
		this.filtered_p = filtered_property;
		
		for (Double d : set)
		{
			this.filtered_set.add(d);
		}
		
	}
	

	public boolean filterRanged_Numeric(double checking_value, int timesteps)
	{
	
		if (Double.isNaN(checking_value))
		{
			//System.out.println("Cannot get distance to filter");
			return true;
		}
		if(checking_value >= this.lowerRange && checking_value <= this.upperRange)
		{
			return true;
		}
		
		

		return false;
	}
	
	
	//4. filter type
	//Agent type or obstacle type
	public boolean filterRange_category(double checking_type, int timesteps)
	{
			
		if (Double.isNaN(checking_type))
		{
			//System.out.println("Cannot get type to filter");
			return true;
		}
		
		if (filtered_set.size() == 0)
		{
			//System.out.println("The filter set is empty - FIlter_ranged.java - filterFour");
			return false;
		}
		
		if (this.filtered_set.contains(checking_type))
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
	
	
	
	//6. filter unreserved property
	public boolean filterNewProperty(Agent target_agent, Agent neighbor_agent, int timesteps, boolean warp, int index)
	{
		double temp_value = neighbor_agent.property_set.get(index).value;

		if(temp_value >= this.lowerRange && temp_value <= this.upperRange)
		{
			return true;
		}

		return false;
	}

	public Filter setRandomFilterRange()
	{
		//Need to create filter here
		ArrayList<Double> filtered_p_option = new ArrayList<Double>();

		for (double i: Main.searchSpace.filter_range_property)
		{
			filtered_p_option.add(i);
		}

		Collections.shuffle(filtered_p_option);
		
		return new Filter_ranged(filtered_p_option.get(0), new NeighborReference(),0);
		
	}
	
	public void mutateCriteria(double extracted_pro, BehaviorTemplate B_temp)
	{
		if (filtered_p == 2.1)
		{
			//Sense left
			if (B_temp.sense_angle_option == -1)
			{
				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				
				while(!(chosen_filter_range.lowerRange < 0 && chosen_filter_range.upperRange < 0) )
				{
					chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				}
				
				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;
			}
			//Sense both
			else if (B_temp.sense_angle_option == 0)
			{
				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				
				while(!(chosen_filter_range.lowerRange < 0 && chosen_filter_range.upperRange > 0) )
				{
					chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				}
				
				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;
			}
			//sense right
			else if (B_temp.sense_angle_option == 1)
			{
				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				
				while(!(chosen_filter_range.lowerRange >= 0 && chosen_filter_range.upperRange > 0) )
				{
					chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
				}
				
				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;
			}
		}
		else if (filtered_p == 4.1 || filtered_p == 4.0)
		{
			this.filtered_set.clear();
			
			Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(filtered_p, Main.searchSpace.filter_template);
			
			for (Double d : chosen_filter_range.filtered_set)
			{
				this.filtered_set.add(d);
			}
		}
		else
		{
			//Property with range criteria
			if (Main.searchSpace.numerical_property.contains(extracted_pro))
			{
				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(extracted_pro, Main.searchSpace.filter_template);

				this.lowerRange = chosen_filter_range.lowerRange;

				this.upperRange = chosen_filter_range.upperRange;

			}
			//Property with category property
			else if (extracted_pro == 4 || extracted_pro == 4.1 || extracted_pro == 5)
			{
				this.filtered_set.clear();

				Filter_ranged chosen_filter_range = (Filter_ranged) Main.searchSpace.getAFilterTemplateOption(extracted_pro, Main.searchSpace.filter_template);


				for (Double d : chosen_filter_range.filtered_set)
				{
					filtered_set.add(d);
				}
			}
		}
		
		
		if (filtered_p == 2.1 && this.lowerRange == 0 && this.upperRange == 0)
		{
			System.out.println("Check filter_range.java");
		}
	}
	
}