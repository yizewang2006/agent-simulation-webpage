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
import Action.SpaceReference_Static;
import Utility.GlobalVariable;
import Utility.ReturnSenseObstacle;
import Utility.myUtility;
import agents.Agent;
import agents.FieldOfView;
import agents.Position;
import agents.Property;
import behavior.BehaviorTemplate;
import core.Main;
import entities.Entity;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;


public class Filter 
{
	public GlobalVariable global_var = new GlobalVariable();
	
	public double filtered_p = 0;
	public int type = 0;
	
	//Since we allow multiple filters that filter the same property
	//We need to check for meaningless filter
	//For example: filter distance with f1 = [0-20] and f2 = [30-40]
	//This filter chain will always return an empty set
	public boolean remove = false;
	public boolean simplify_check = false;
	
	public Filter()
	{
		
	}
	
	//For random filter
	public Filter(int type, double filtered_p)
	{
		this.type = type;
		this.filtered_p = filtered_p;
		
	}

	
	public ArrayList<Filter> setRandomFilterChain(Action act)
	{

		Random rand = new Random();
		
		ArrayList<Filter> filter_chain_local = new ArrayList<Filter>();
		
		//Need to create filter here
		ArrayList<Double> filtered_p_option = new ArrayList<Double>();
		
		//Add the template filter
		//Add category filter
		//filter_chain_local.add(new Filter_ranged(4.0, B_temp.category_filter_option));
		
		//Add sense angle filter
		//filter_chain_local.add(new Filter_ranged(2.1, B_temp.sense_angle_option));
		
		if (act instanceof NeighborReference)
		{
			//Add option for filter_range here
			for (double i: Main.searchSpace.filter_range_property)
			{
				filtered_p_option.add(i);
			}
			
			for (Filter f: filter_chain_local)
			{
				if (f instanceof Filter_ranged)
				{
					Filter_ranged fr = (Filter_ranged) f;
					
					filtered_p_option.removeIf(n -> n == fr.filtered_p);
				}
				
			}
			//Not allow filter chain with multiple filters that filter the same property
			Collections.shuffle(filtered_p_option);
		
			//Filter chain can only have maximum a certain of filter
			int random_num_filter = rand.nextInt(global_var.max_filter);
			
			for (int i = 0; i < random_num_filter; i++)
			{	
				//Allow filter chain with multiple filters that filter the same property
				//Collections.shuffle(filtered_p_option);
				/*
				//Before the last filter
				//All filters are ranged filter
				if (i < random_num_filter - 1)
				{
					filter_chain_local.add(new Filter_ranged(filtered_p_option.get(i)));	
				}
				//When hitting the last filter
				//Filter has option between ranged or method filter
				
				else
				{					
					int random_filter_type = Main.searchSpace.filter_type.get(rand.nextInt(Main.searchSpace.filter_type.size()));
					//Range filter
					if (random_filter_type == 0)
					{
						filter_chain_local.add(new Filter_ranged(filtered_p_option.get(i)));
					}
					//Method filter
					else
					{
						//Method filter does not work for category type
						//-> need to reset filtered_p_option and remove category option
						filtered_p_option.clear();
						
						//Add option for filter_method here
						for (double d: Main.searchSpace.filter_method_property)
						{
							filtered_p_option.add(d);
						}

						Collections.shuffle(filtered_p_option);
						
						filter_chain_local.add(new Filter_method(filtered_p_option.get(0)));
					}
				}
				*/
				
				filter_chain_local.add(new Filter_ranged(filtered_p_option.get(i), new NeighborReference(),0));
				
				//If there is a zone filter
				// -> There is no need to add other filter.
				if (filtered_p_option.get(i) == 4.0)
				{
					filter_chain_local.removeIf(n -> n.filtered_p != 4.0);
					//If there is a zone filter -> the combination filter take the nearest distance. 
					filter_chain_local.add(new Filter_method(1,1));
					
					return filter_chain_local;
				}
			
			}
			//Last filter is always the nearest filter		
			filter_chain_local.add(new Filter_method(1,new NeighborReference()));
		}
		else if (act instanceof SpaceReference_Expand)
		{
			for (double i: Main.searchSpace.filter_range_property_space)
			{
				filtered_p_option.add(i);
			}
			
			//Not allow filter chain with multiple filters that filter the same property
			Collections.shuffle(filtered_p_option);

			//Filter chain can only have maximum a certain of filter
			int random_num_filter = rand.nextInt(global_var.max_filter);

			for (int i = 0; i < random_num_filter; i++)
			{	
				filter_chain_local.add(new Filter_ranged(filtered_p_option.get(i), new SpaceReference_Expand(),1));
				
			}
			
			//Since combination method is used directly in space behavior
			//Such as: choosing nearest to desired direction, etc..
			//Filter chain for space behavior should not have filter method.
			
		}
		else if (act instanceof SpaceReference_Static)
		{
			for (double i: Main.searchSpace.filter_range_property_space)
			{
				filtered_p_option.add(i);
			}
			
			//Not allow filter chain with multiple filters that filter the same property
			Collections.shuffle(filtered_p_option);

			//Filter chain can only have maximum a certain of filter
			int random_num_filter = rand.nextInt(global_var.max_filter);

			for (int i = 0; i < random_num_filter; i++)
			{	
				filter_chain_local.add(new Filter_ranged(filtered_p_option.get(i), new SpaceReference_Expand(),1));
				
			}
			
			//Since combination method is used directly in space behavior
			//Such as: choosing nearest to desired direction, etc..
			//Filter chain for space behavior should not have filter method.
			
		}	
		return filter_chain_local;
	}
	
	
	public ArrayList<Filter> mutateFilterChain(ArrayList<Filter> filter_chain, BehaviorTemplate b_temp)
	{
		Random rand = new Random();
		
		//Need to create filter here
		ArrayList<Double> filtered_p_option = new ArrayList<Double>();
		
		for (double i: Main.searchSpace.filter_range_property)
		{
			filtered_p_option.add(i);
		}
		
		Collections.shuffle(filtered_p_option);
		
		//0: Add a new filter
		//1: Remove a filter
		//2: Modify a filter
		int random_option = rand.nextInt(3);

		random_option = 2;
		//0: Add a new filter
		if (random_option == 0)
		{
			//List of filter_p that already in filter chain
			//ArrayList<Double> filter_p_in_fc = new ArrayList<Double>();
			
			for (Filter f: filter_chain)
			{
				filtered_p_option.removeIf( n -> n == f.filtered_p);
			}
			
			//0: Add a range filter
			//1: Add a method filter
			random_option = Main.searchSpace.filter_type.get(rand.nextInt(Main.searchSpace.filter_type.size()));
			
			//0: Add a range filter
			if (random_option == 0)
			{
				if (filtered_p_option.size() != 0)
				{
					Filter_ranged F = new Filter_ranged(filtered_p_option.get(0), new NeighborReference(),0);
					//If the filter is empty -> just add
					if (filter_chain.size() == 0)
					{
						filter_chain.add(F);
					}
					//If filter_chain is not empty, add before the last one
					//Just in case the last on is method filter
					else
					{
						filter_chain.add(filter_chain.size() - 1, F);
					}
					
					
					return filter_chain;
				}
				//ONly return null if filter_chain has all filter property
				//Which is very unlikely
				//System.out.println("Filter_chain has all property filter in search space - Very unlikely - Filter.java");
				return null;
				
			}
			//1: Add a method filter
			//For now, no mutation on combination filter.
			else if (random_option == 1)
			{
				/*
				filtered_p_option.clear();
				
				//Add option for filter_method here
				for (double d: Main.searchSpace.filter_method_property)
				{
					filtered_p_option.add(d);
				}
				
				//If the filter is empty -> just add
				if (filter_chain.size() == 0)
				{
					
					Collections.shuffle(filtered_p_option);
					
					filter_chain.add(new Filter_method(filtered_p_option.get(0)));
				}
				else
				{
					//If the last filter of filter_chain is method filter -> do nothing
					if (filter_chain.get(filter_chain.size()-1) instanceof Filter_method)
					{
						return null;
					}
					else
					{
						Collections.shuffle(filtered_p_option);
						
						filter_chain.add(new Filter_method(filtered_p_option.get(0)));
					}
				}
				*/
				return filter_chain;
			}
						
		}
		//1: Remove a filter
		else if (random_option == 1)
		{
			if(filter_chain.size() > 0)
			{
				int random_F_index = rand.nextInt(filter_chain.size());
				
				//Not remove the filter in template
				if (filter_chain.get(random_F_index).filtered_p == 1.0 || filter_chain.get(random_F_index).filtered_p == 3.0)
				{
					filter_chain.remove(random_F_index);
				}
				
				return filter_chain;
			}
			else
			{
				//Remove a filter in an empty filter_chain
				return null;
			}
		}
		//2: Modify a filter
		else if (random_option == 2)
		{
			
			if(filter_chain.size() > 0)
			{
				int random_F_index = rand.nextInt(filter_chain.size());

				Filter chosen_F = filter_chain.get(random_F_index);
				
				if (chosen_F instanceof Filter_ranged)
				{
					//0: mutate filter property
					//1: mutate criteria
					random_option = rand.nextInt(2);	
					
					random_option = 1;
					
					Filter_ranged F = (Filter_ranged) chosen_F;
					
					//0: mutate filter property
					if (random_option == 0)
					{	
						chosen_F = (Filter_ranged) F.setRandomFilterRange();
						
					}
					//1: mutate criteria
					else if (random_option == 1)
					{
						if (chosen_F.filtered_p == 2.1)
						{
							F.mutateCriteria(2.1, b_temp);
						}
						else if ( chosen_F.filtered_p == 4.1)
						{
							F.mutateCriteria(4.1, b_temp);
						}
						else
						{
							F.mutateCriteria(chosen_F.filtered_p, b_temp);
						}
						
					}
					
					filter_chain.remove(random_F_index);
					
					filter_chain.add(random_F_index, chosen_F);
					
					filter_chain = removeUneccessaryFilterChain(filter_chain);
				}
				else if (chosen_F instanceof Filter_method)
				{
					/*
					random_option = rand.nextInt(2);							
					
					//Mutate the combination property
					if (random_option == 0)
					{
						Filter_method F = (Filter_method) chosen_F;
						
						chosen_F = (Filter_method) F.setRandomFilterMethod();
					
					}
					//Only mutate the combination method
					else if (random_option == 1)
					{
						chosen_F =  new Filter_method(chosen_F.filtered_p);
						
					}
						
					filter_chain.remove(random_F_index);
					
					filter_chain.add(random_F_index, chosen_F);
					*/
				}
				
				return filter_chain;
			}
			else
			{
				//System.out.println("Try to mutate an empty filter chain - Filter.java muateFilterChain");
				return null;
			}
		}
		
		
		return filter_chain;
		
	}
	
	public ArrayList<Filter> removeUneccessaryFilterChain(ArrayList<Filter> filter_chain)
	{
		//Need to remove meaningless filters
		//For example: filter distance with f1 = [0-20] and f2 = [30-40]
		//This filter chain will always return an empty set

		if (filter_chain.get(0) instanceof Filter_ranged)
		{
			Filter_ranged f1r = (Filter_ranged) filter_chain.get(0);

			for (Filter f2: filter_chain)
			{
				if (f2 instanceof Filter_ranged)
				{

					Filter_ranged f2r = (Filter_ranged) f2;

					if (f1r != f2r)
					{
						if (f1r.filtered_p == f2r.filtered_p)
						{
							if (Main.searchSpace.numerical_property.contains(f1r.filtered_p))
							{
							
								if (f1r.remove == false)
								{
									if (f1r.upperRange <= f2r.lowerRange || f2r.upperRange <= f1r.lowerRange)
									{
										f2r.remove = true;
									}
								}
							}
							//This is the range set
							//Must have union value between 2 set
							else
							{
								boolean remove = true;
						

								for (Double d1 : f1r.filtered_set)
								{
									for (Double d2: f2r.filtered_set)
									{
										if (d1 == d2)
										{
											remove = false;
										}
									}
								}

								//Meaning there is no common element between 2 sets
								if (remove == true)
								{
									f2r.remove = true;
								}
							}
						}
					}

				}

			}
		}

		filter_chain.removeIf(n->n.remove == true);

		return filter_chain;
	}
}