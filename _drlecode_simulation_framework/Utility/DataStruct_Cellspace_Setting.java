package Utility;

import java.util.ArrayList;

public class DataStruct_Cellspace_Setting 
{
	public int index;
	
	public ArrayList<Double> score = new ArrayList<Double>();
	
	public double average = 0;
	
	public DataStruct_Cellspace_Setting(int i)
	{
		this.index = i;
	}
	
	
	public void add_score(double d)
	{
		this.score.add(d);
	}
	
	public void calculateAverage()
	{
		double sum = 0;
		
		for (Double s : score)
		{
			sum += s;
		}
		
		average = sum/score.size();
	}
}
